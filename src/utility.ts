function getInputValue(elementID: string): number {
  const inputElement: HTMLInputElement = <HTMLInputElement>document.getElementById(elementID)
  return inputElement.valueAsNumber
}

function setInputValue(elementID: string, value: number) {
  const inputElement: HTMLInputElement = <HTMLInputElement>document.getElementById(elementID)
  inputElement.valueAsNumber = value
}
function setOutputValue(elementID: string, value: number, decimals: number = 2) {
  const element: HTMLOutputElement = <HTMLOutputElement>document.getElementById(elementID)
  element.value = value.toFixed(decimals)
}

function getSelectedRadioButton(elementName: string): string | undefined {
  const radioElements: NodeListOf<HTMLInputElement> = <NodeListOf<HTMLInputElement>>document.getElementsByName(elementName)
  for (let i: number = 0; i < radioElements.length; i++) {
    if (radioElements[i].checked) {
      return radioElements[i].value.toLowerCase()
    }
  }
  return undefined
}

function setAttributes(elementID: string, min: string, max: string, step: string, value: number) {
  const el: HTMLInputElement = <HTMLInputElement>document.getElementById(elementID)
  if (el) {
    el.min = min
    el.max = max
    el.step = step
    el.valueAsNumber = value
  }
}

export { getInputValue as getNumericValue, setInputValue, setOutputValue, getSelectedRadioButton, setAttributes }
