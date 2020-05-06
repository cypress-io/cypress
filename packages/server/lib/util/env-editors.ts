const linuxEditors = [
  {
    id: 'atom',
    binary: 'atom',
    name: 'Atom',
  }, {
    id: 'brackets',
    binary: 'brackets',
    name: 'Brackets',
  }, {
    id: 'code',
    binary: 'code',
    name: 'Visual Studio Code',
  }, {
    id: 'emacs',
    binary: 'emacs',
    name: 'Emacs',
  }, {
    id: 'idea',
    binary: 'idea',
    name: 'IntelliJ IDEA',
  }, {
    id: 'phpstorm',
    binary: 'phpstorm',
    name: 'PhpStorm',
  }, {
    id: 'pycharm',
    binary: 'pycharm',
    name: 'PyCharm',
  }, {
    id: 'rubymine',
    binary: 'rubymine',
    name: 'RubyMine',
  }, {
    id: 'sublimetext',
    binary: 'subl',
    name: 'Sublime Text',
  }, {
    id: 'vim',
    binary: 'vim',
    name: 'Vim',
  }, {
    id: 'webstorm',
    binary: 'webstorm',
    name: 'WebStorm',
  },
]

const osxEditors = [
  {
    id: 'atom',
    binary: 'atom',
    name: 'Atom',
  }, {
    id: 'atombeta',
    binary: '/Applications/Atom Beta.app/Contents/MacOS/Atom Beta',
    name: 'Atom Beta',
  }, {
    id: 'brackets',
    binary: 'brackets',
    name: 'Brackets',
  }, {
    id: 'sublimetext',
    binary: '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl',
    name: 'Sublime Text',
  }, {
    id: 'sublimetext2',
    binary: '/Applications/Sublime Text 2.app/Contents/SharedSupport/bin/subl',
    name: 'Sublime Text 2',
  }, {
    id: 'sublimetextdev',
    binary: '/Applications/Sublime Text Dev.app/Contents/SharedSupport/bin/subl',
    name: 'Sublime Text Dev',
  }, {
    id: 'code',
    binary: 'code',
    name: 'Visual Studio Code',
  }, {
    id: 'insiders',
    binary: 'code-insiders',
    name: 'Visual Studio Vode Insiders',
  }, {
    id: 'emacs',
    binary: 'emacs',
    name: 'Emacs',
  }, {
    id: 'appcode',
    binary: '/Applications/AppCode.app/Contents/MacOS/appcode',
    name: 'AppCode',
  }, {
    id: 'clion',
    binary: '/Applications/CLion.app/Contents/MacOS/clion',
    name: 'CLion',
  }, {
    id: 'idea',
    binary: '/Applications/IntelliJ IDEA.app/Contents/MacOS/idea',
    name: 'IntelliJ IDEA',
  }, {
    id: 'phpstorm',
    binary: '/Applications/PhpStorm.app/Contents/MacOS/phpstorm',
    name: 'PhpStorm',
  }, {
    id: 'pycharm',
    binary: '/Applications/PyCharm.app/Contents/MacOS/pycharm',
    name: 'PyCharm',
  }, {
    id: 'pycharm',
    binary: '/Applications/PyCharm CE.app/Contents/MacOS/pycharm',
    name: 'PyCharm CE',
  }, {
    id: 'rubymine',
    binary: '/Applications/RubyMine.app/Contents/MacOS/rubymine',
    name: 'RubyMine',
  }, {
    id: 'webstorm',
    binary: '/Applications/WebStorm.app/Contents/MacOS/webstorm',
    name: 'WebStorm',
  }, {
    id: 'vim',
    binary: 'vim',
    name: 'Vim',
  },
]

const windowsEditors = [
  {
    id: 'brackets',
    binary: 'Brackets.exe',
    name: 'Brackets',
  }, {
    id: 'code',
    binary: 'Code.exe',
    name: 'Visual Studio Code',
  }, {
    id: 'atom',
    binary: 'atom.exe',
    name: 'Atom',
  }, {
    id: 'sublimetext',
    binary: 'sublime_text.exe',
    name: 'Sublime Text',
  }, {
    id: 'notepad',
    binary: 'notepad++.exe',
    name: 'Notepad++',
  }, {
    id: 'clion',
    binary: 'clion.exe',
    name: 'CLion',
  }, {
    id: 'clion64',
    binary: 'clion64.exe',
    name: 'CLion (64-bit)',
  }, {
    id: 'idea',
    binary: 'idea.exe',
    name: 'IntelliJ IDEA',
  }, {
    id: 'idea64',
    binary: 'idea64.exe',
    name: 'IntelliJ IDEA (64-bit)',
  }, {
    id: 'phpstorm',
    binary: 'phpstorm.exe',
    name: 'PhpStorm',
  }, {
    id: 'phpstorm64',
    binary: 'phpstorm64.exe',
    name: 'PhpStorm (64-bit)',
  }, {
    id: 'pycharm',
    binary: 'pycharm.exe',
    name: 'PyCharm',
  }, {
    id: 'pycharm64',
    binary: 'pycharm64.exe',
    name: 'PyCharm (64-bit)',
  }, {
    id: 'rubymine',
    binary: 'rubymine.exe',
    name: 'Rubymine',
  }, {
    id: 'rubymine64',
    binary: 'rubymine64.exe',
    name: 'Rubymine (64-bit)',
  }, {
    id: 'webstorm',
    binary: 'webstorm.exe',
    name: 'WebStorm',
  }, {
    id: 'webstorm64',
    binary: 'webstorm64.exe',
    name: 'WebStorm (64-bit)',
  },
]

export interface Editor {
  id: string
  binary: string
  name: string
}

export const getEnvEditors = (): Editor[] => {
  switch (process.platform) {
    case 'darwin':
      return osxEditors
    case 'win32':
      return windowsEditors
    default:
      return linuxEditors
  }
}
