describe("Bar Spec", function(){
  beforeEach(function(){
    console.info("beforeEach Bar")
    // Ecl.foo()
    App.start({title: "Bar Spec", color: "#FFB61C"})
  });

  // it("can bar [aab]", function(){
    // Ecl.foo.bar()

    // try {
    // Ecl.foo.bar()
    //   Ecl.find("#red").click()
    //   expect("bar").to.eq("bar");
    // } catch (e) {
    //   console.warn("error from within can bar", e)
    // }
  // });

  it("can bar2 [aac]", function(){
    Ecl.log("can bar2");
    Ecl.find("#green").click()
    expect("bar2").to.eq("bar2");
  });

  // it("can bar3 [aad]", function(){
  //   Ecl.log("can bar2");
  //   Ecl.find("#blue").click()
  //   expect("bar2").to.eq("bar2");
  // });
});