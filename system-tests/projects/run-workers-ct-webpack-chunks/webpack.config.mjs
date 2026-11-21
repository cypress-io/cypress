import fs from 'fs'
import path from 'path'

import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// a page requests the chunks named by the build it loaded, so a rebuild that renames one leaves the page a file that's gone
class RecordChunks {
  apply (compiler) {
    compiler.hooks.done.tap('RecordChunks', (stats) => {
      const files = [...stats.compilation.chunks].flatMap((chunk) => [...chunk.files]).sort()

      fs.appendFileSync(path.join(__dirname, 'chunks.jsonl'), `${JSON.stringify(files)}\n`)
    })
  }
}

export default {
  plugins: [new RecordChunks()],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
}
