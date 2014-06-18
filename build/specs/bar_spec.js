describe("Bar Spec", function(){
  it("can bar [aab]", function(){
    console.warn("can bar");
    expect("bar").to.eq("bar");
  });

  it("can bar2 [aac]", function(){
    console.warn("can bar2 [aac]");
    expect("bar2").to.eq("bar2");
  });
});