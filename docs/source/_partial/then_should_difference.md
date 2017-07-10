***What's the difference between `.then()` and `.should()`/`.and()`?***

Using `.then()` simply allows you to use the yielded subject in a callback function and should be used when you need to manipulate some values or do some actions.

When using a callback function with `.should()` or `.and()`, on the other hand, there is special logic to rerun the callback function until no assertions throw within it. You should be careful of side affects in a `.should()` or `.and()` callback function that you would not want performed multiple times.
