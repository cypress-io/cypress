<template>
  <CalcContainer class="container">
    <CalcDisplay> {{ negative ? "-" : "" }}{{ result }} </CalcDisplay>
    <div class="keyboard">
      <div class="misc">
        <CalcButton variant="dark" value="AC" @click="reset" />
        <CalcButton variant="dark" value="+/-" @click="handleNegative" />
        <CalcButton variant="dark" value="%" @click="handlePercent" />
      </div>
      <div class="operators">
        <CalcButton variant="operator" value="÷" @click="handleOperator" />
        <CalcButton variant="operator" value="x" @click="handleOperator" />
        <CalcButton variant="operator" value="-" @click="handleOperator" />
        <CalcButton variant="operator" value="+" @click="handleOperator" />
        <CalcButton variant="operator" value="=" @click="handleEqual" />
      </div>
      <div class="numbers">
        <CalcButton
          v-for="i of numbers"
          :key="i"
          @click="handleNumber"
          :value="i.toString()"
        />
        <CalcButton value="." @click="handleNumber" />
        <CalcButton variant="wide" value="0" @click="handleNumber" />
      </div>
    </div>
  </CalcContainer>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

import CalcContainer from "./components/Container.vue";
import CalcDisplay from "./components/Display.vue";
import CalcButton from "./components/Button.vue";

export default defineComponent({
  name: "App",
  components: {
    CalcContainer,
    CalcDisplay,
    CalcButton,
  },
  setup() {
    const result = ref("0");
    const negative = ref(false);
    const numbers = [9, 8, 7, 6, 5, 4, 3, 2, 1];
    let currentNumber = "";
    let operator = "";
    let firstOperand = 0;

    function evalCurrentNumber(): number {
      const sign = negative.value ? -1 : 1;
      negative.value = false;
      return sign * parseFloat(currentNumber);
    }

    function calculate(): number {
      switch (operator) {
        case "+":
          return firstOperand + evalCurrentNumber();
        case "-":
          return firstOperand - evalCurrentNumber();
        case "x":
          return firstOperand * evalCurrentNumber();
        case "÷":
          return firstOperand / evalCurrentNumber();
        default:
          return 0;
      }
    }

    function handleNumber(digit: string) {
      if (!currentNumber.length) {
        if (digit === ".") {
          currentNumber = "0";
        }
        if (digit === "0") {
          return;
        }
      }
      currentNumber += digit;
      result.value = currentNumber;
    }

    function handleOperator(_operator: string) {
      // if operator already set, calculate and save the currentValue
      if (operator.length) {
        firstOperand = calculate();
      }
      if (!firstOperand) {
        firstOperand = evalCurrentNumber();
      }
      currentNumber = "";
      operator = _operator;
    }

    function handleNegative() {
      negative.value = !negative.value;
    }

    function handleEqual() {
      if (!operator.length) {
        return;
      }
      firstOperand = calculate();
      operator = "";
      result.value = firstOperand.toString();
    }

    function trimZeroes(num: string): string {
      if (/\./.test(num)) {
        num = num.replace(/0+$/, "");
      }
      num = num.replace(/^0+/, "0");
      return num;
    }

    function handlePercent() {
      currentNumber = "00" + currentNumber;
      currentNumber = trimZeroes(
        currentNumber.slice(0, -2) + "." + currentNumber.slice(-2)
      );

      result.value = currentNumber;
    }

    function reset() {
      currentNumber = "";
      operator = "";
      firstOperand = 0;
      negative.value = false;
      result.value = firstOperand.toString();
      handleEqual();
    }

    return {
      result,
      numbers,
      handleNumber,
      handleEqual,
      handleOperator,
      handleNegative,
      reset,
      negative,
      handlePercent,
    };
  },
});
</script>

<style scoped>
.container {
  width: 280px;
  margin: auto;
  background: #111;
}
.keyboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
.misc {
  grid-area: 1 / 1 / 2 / 4;
}
.operators {
  grid-row: 1 / 6;
}
.numbers {
  grid-column: 1/4;
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
}
</style>
