# example: visual tests for sudoku

This React Sudoku app was cloned from [raravi/sudoku](https://github.com/raravi/sudoku).

Visual testing uses open source [palmerhq/cypress-image-snapshot](https://github.com/palmerhq/cypress-image-snapshot) plugin.

Example failing test [src/App.cy-spec.js](src/App.cy-spec.js)

![failing test](images/test.png)

Because there is a difference in the numbers displayed on the board

![Visual diff](images/board-diff.png)
