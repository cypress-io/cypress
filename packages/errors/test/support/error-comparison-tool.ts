/* eslint-disable no-console */
import express from 'express'
import fs from 'fs-extra'
import globby from 'globby'
import Markdown from 'markdown-it'
import path from 'path'
import { WIDTH } from './utils'

const ERRORS_DIR = path.join(__dirname, '..', '..')
const SNAPSHOT_HTML = path.join(ERRORS_DIR, '__snapshot-html__')
const SNAPSHOT_HTML_LOCAL = path.join(ERRORS_DIR, '__snapshot-html-local__')
const SNAPSHOT_MARKDOWN = path.join(ERRORS_DIR, '__snapshot-md__')

const app = express()

const LINKS = `<h5><a href="/">Ansi Compare</a> | <a href="/base-list">Ansi Base List</a> | <a href="/md">Markdown</a> | <input id="search" placeholder="search error by name"><button id="go">go</button></h5>`

const SEARCH_HANDLER = `
<script type="text/javascript">
$(document).on('click', '#go', (ev) => {
  const val = $('#search').val()
  window.location.search = 'spec=' + val
})
$(document).ready(() => {
  const u = new URL(window.location.href)
  const spec = u.searchParams.get('spec')
  $('#search').val(spec)
})
</script>
`

const getFiles = async (baseDir: string, spec?: string) => {
  const pattern = spec ? `${spec}*` : '**/*'

  return (await globby(`${baseDir}/${pattern}`))
}

async function getRows (offset = 0, baseList: boolean = false, spec?: string) {
  const baseDir = baseList ? SNAPSHOT_HTML : SNAPSHOT_HTML_LOCAL
  const toCompare = await getFiles(baseDir, spec)

  const rows = toCompare.filter((f) => f.endsWith('.html')).sort().slice(offset, offset + 10).map((f) => path.basename(f).split('.')[0]).map((name) => {
    const width = baseList ? WIDTH : 550
    // const height = baseList ? HEIGHT : 600
    const height = 400

    return `
    <tr id="${name}">
      <td>${name}</td>
      <td colspan="2"><iframe src="/html/${name}/__snapshot-html__" width="${width}" height="${height}"></iframe></td>
      ${baseList ? '' : `
        <td colspan="2"><iframe src="/html/${name}/__snapshot-html-local__" width="${width}" height="${height}"></iframe></td>
        <td><button data-looks-good="${name}">Looks Good</button></td>
      `}
    </tr>`
  })

  if (toCompare.length > offset + 10) {
    rows.push(`<tr id="loadMore"><td colspan="6"><button style="width:100%" data-load-more="${offset + 10}">Load More</button></td><tr>`)
  }

  return rows.join('\n')
}

app.get('/', async (req, res) => {
  try {
    const rows = await getRows()

    res.type('html').send(`
      <script src="https://code.jquery.com/jquery-3.6.0.js" integrity="sha256-H+K7U5CnXl1h5ywQfKtSj8PCmoN9aaq30gDh27Xc0jk=" crossorigin="anonymous"></script>
      <script type="text/javascript">
      $(document).on('click', '[data-looks-good]', (ev) => {
        const id = $(ev.currentTarget).data('looksGood')
        fetch('/looks-good/' + id)
          .then((res) => res.json())
          .then(() => {
            $('#' + id).remove()
          })
          .catch(e => {
            alert(e.stack)
          })
      })
      $(document).on('click', '[data-load-more]', (ev) => {
        const offset = $(ev.currentTarget).data('loadMore')
        $('#loadMore').remove()
        fetch('/load-more/' + offset)
          .then(res => res.text())
          .then((val) => {
            $(val).appendTo('tbody')
          })
      })
      </script>
      ${LINKS}
      <table>
        <thead>
          <tr><th>Table</th><th colspan="2">Original</th><th colspan="2">New</th></tr>
        <thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `)
  } catch (e) {
    res.json({ errStack: e.stack })
  }
})

app.get('/base-list', async (req, res) => {
  const spec = req.query.spec as string

  try {
    const rows = await getRows(0, true, spec)

    res.type('html').send(`
      <script src="https://code.jquery.com/jquery-3.6.0.js" integrity="sha256-H+K7U5CnXl1h5ywQfKtSj8PCmoN9aaq30gDh27Xc0jk=" crossorigin="anonymous"></script>
      <script type="text/javascript">
      $(document).on('click', '[data-load-more]', (ev) => {
        const offset = $(ev.currentTarget).data('loadMore')
        $('#loadMore').remove()
        fetch('/load-more-base/' + offset)
          .then(res => res.text())
          .then((val) => {
            $(val).appendTo('tbody')
          })
      })
      </script>
      ${LINKS}
      ${SEARCH_HANDLER}
      <table>
        <thead>
          <tr><th>Table</th><th colspan="2">Original</th></tr>
        <thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `)
  } catch (e) {
    res.json({ errStack: e.stack })
  }
})

app.get<{offset: number}>('/load-more/:offset', async (req, res) => {
  const rows = await getRows(req.params.offset)

  res.send(rows)
})

app.get<{offset: number}>('/load-more-base/:offset', async (req, res) => {
  const rows = await getRows(req.params.offset, true)

  res.send(rows)
})

app.get('/looks-good/:name', async (req, res) => {
  try {
    await fs.move(
      path.join(SNAPSHOT_HTML_LOCAL, `${req.params.name}.html`),
      path.join(SNAPSHOT_HTML, `${req.params.name}.html`),
      { overwrite: true },
    )

    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ stack: e.stack })
  }
})

app.get<{name: string, type: string}>('/html/:name/:type', async (req, res) => {
  const pathToFile = path.join(ERRORS_DIR, req.params.type, `${req.params.name}.html`)

  try {
    const contents = await fs.readFile(pathToFile, 'utf8')

    res.type('html').send(contents.replace(/\<link(.*?)>/g, '').replace('overflow: hidden;', ''))
  } catch (e) {
    res.json({ errStack: e })
  }
})

app.get('/md', async (req, res) => {
  const spec = req.query.spec as string

  try {
    const toRender = (await getFiles(SNAPSHOT_MARKDOWN, spec)).filter((f) => f.endsWith('.md')).sort()
    const markdownContents = await Promise.all(toRender.map((f) => fs.readFile(f, 'utf8')))
    const md = new Markdown({
      html: true,
      linkify: true,
    })

    res.type('html').send(`
      <script src="https://code.jquery.com/jquery-3.6.0.js" integrity="sha256-H+K7U5CnXl1h5ywQfKtSj8PCmoN9aaq30gDh27Xc0jk=" crossorigin="anonymous"></script>
      ${LINKS}
      ${SEARCH_HANDLER}
      <style>
      tr {
        outline: 1px solid black;
      }
      pre {
        overflow: scroll;
      }
      </style>
      <div>
        ${toRender.map((r, i) => {
      return `<div style="border: 1px solid grey; margin-bottom: 10px;">
          <div>${path.basename(r).split('.')[0]}</div>
          <div style="width: 100%; display: flex;">
            <div style="width: 50%">${md.render(markdownContents[i] ?? '')}</div>
            <div style="width: 50%; overflow: scroll;"><pre>${markdownContents[i] ?? ''}</pre></div>
          </div>
        </div>`
    }).join('\n')}
      </div>
    `)
  } catch (e) {
    res.json({ stack: e.stack })
  }
})

app.listen(5555, () => {
  console.log(`Comparison server listening on: http://localhost:5555`)
})
