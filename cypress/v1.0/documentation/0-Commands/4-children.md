slug: children

### [cy.children()](#usage)

Get the children of each element in the set of matched elements, optionally filtered by a selector.

### [cy.children( *selector* )](#selector-usage)

The `.children()` method optionally accepts a selector expression. If the selector is supplied, the elements will be filtered by testing whether they match it.

## Usage

[block:code]
{
    "codes": [
        {
            "code": "<ul class=\"level-1\">\n  <li class=\"item-i\">I</li>\n  <li class=\"item-ii\">II\n    <ul class=\"level-2\">\n      <li class=\"item-a\">A</li>\n      <li class=\"item-b\">B\n        <ul class=\"level-3\">\n          <li class=\"item-1\">1</li>\n          <li class=\"item-2\">2</li>\n          <li class=\"item-3\">3</li>\n        </ul>\n      </li>\n      <li class=\"item-c\">C</li>\n    </ul>\n  </li>\n  <li class=\"item-iii\">III</li>\n</ul>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// returns [\n//  <li class=\"item-a\"></li>,\n//  <li class=\"item-b\"></li>,\n//  <li class=\"item-c\"></li>\n// ]\ncy.get(\"ul.level-2\").children()\n",
            "language": "js"
        }
    ]
}
[/block]

## Selector Usage

[block:code]
{
    "codes": [
        {
            "code": "<div>\n  <span>Hello</span>\n  <p class=\"selected\">Hello Again</p>\n  <div class=\"selected\">And Again</div>\n  <p>And One Last Time</p>\n</div>\n",
            "language": "html"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// returns [<p class=\"selected\">Hello Again</p>, <div class=\"selected\">And Again</div>]\ncy.get(\"div\").children(\".selected\")\n",
            "language": "js"
        }
    ]
}
[/block]

## Command Log

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\".left-nav>.nav\").children().should(\"have.length\", 8)\n",
            "language": "js"
        }
    ]
}
[/block]

The commands above will display in the command log as:

<img width="521" alt="screen shot 2015-11-27 at 1 52 26 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447069/2b0f8a7e-950e-11e5-96b5-9d82d9fdddec.png">

When clicking on the `children` command within the command log, the console outputs the following:

<img width="542" alt="screen shot 2015-11-27 at 1 52 41 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447071/2e9252bc-950e-11e5-9a32-e5860da89160.png">

## Related
1. [parent](parent)
2. [parents](parents)
3. [next](next)
4. [siblings](siblings)