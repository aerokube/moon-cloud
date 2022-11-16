const defaultParams = {
  blockName: "pricing-range",
  ranges: [
    {
      name: "limit",
      title: "Parallel browsers",
      values: [10, 20, 50, 100, 500],
      value: 20
    },
    {
      name: "hours",
      title: "Automation hours per day",
      values: [0, 1, 2, 4, 8, 24],
      value: 0
    },
    {
      name: "duration",
      title: "Average test duration in minutes",
      values: [1, 3, 5, 10, 20],
      value: 1
    }
  ]
};

const price = {
  maintenanceCommission: 1.25,
  permanent: 170, // per month
  variable: 0.192 // per hour
};

class Range {
  constructor(selector, params = {}) {
    if (!selector) {
      throw new Error("No target element specified");
    }

    this.params = Object.assign({}, defaultParams, params);
    this.blockName = params.blockName;
    this.selector = selector;
    this.rangeContainer = selector.querySelector(".pricing-range__range-container");
    this.selectContainer = selector.querySelector(".pricing-range__selects");
    this.value = null;
    this.count = null;
    this.ranges = [];

    this.createRanges();
    this.createOdometers();

    this.setValue();
  }

  setValue() {
    const dailyUsage = this.ranges
      .filter((r) => r.name === "limit" || r.name === "hours")
      .map((r) => r.value)
      .reduce((acc, r) => acc * r); // Hours * parallel sessions
    const monthlyUsage = 21 * dailyUsage;
    const vmMonthlyUsage = monthlyUsage / 4; // 1 VM == 4 browsers
    this.value = price.maintenanceCommission * (price.permanent + price.variable * vmMonthlyUsage);
    if (this.odometer) {
      this.odometer.update(this.value);
    }

    const avgTestDuration = this.ranges
      .filter((r) => r.name === "duration")
      .map((r) => r.value);
    this.count = dailyUsage * 60 / avgTestDuration;
    if (this.countOdometer) {
      this.countOdometer.update(this.count);
    }
  }

  createRanges() {
    this.ranges = this.params.ranges.map(this.createRange, this);

    this.ranges.forEach((range) => {
      this.createRangeEventListener(range);
      this.setRange(range);
    });
  }

  createRange(range) {
    const container = document.createElement("div");
    container.classList.add("d-none", "d-sm-block", "pricing-range__range");

    const line = document.createElement("div");
    line.classList.add("pricing-range__range-line");
    container.appendChild(line);

    const lol = document.createElement("div");
    lol.classList.add("lol");
    line.appendChild(lol);

    const items = new Map();
    const select = this.createRangeSelect(range);

    range.values.forEach((value) => {
      const valueMapItem = this.createRangeItem(range, value);
      items.set(value, valueMapItem);

      line.appendChild(valueMapItem.container);
    });

    const title = document.createElement("p");
    title.classList.add("range-item-container");
    title.classList.add("pricing-range__title");
    title.innerText = range.title;

    line.appendChild(title);
    this.rangeContainer.appendChild(container);

    return {
      container,
      select,
      items,
      name: range.name,
      value: range.value,
      title: range.title
    };
  }

  createRangeSelect(range) {
    const label = document.createElement("label");
    label.classList.add("d-flex", "justify-content-between", "align-items-center", "d-sm-none", "pricing-range__range-label");

    const title = document.createElement("span");
    title.innerText = range.title + ": ";
    label.appendChild(title);

    const wrapper = document.createElement("span");
    wrapper.classList.add("select-wrapper");

    const select = document.createElement("select");
    select.classList.add("select", "pricing-range__range-select");

    wrapper.appendChild(select);
    label.appendChild(wrapper);

    this.selectContainer.appendChild(label);

    range.values.forEach((value) => {
      const element = document.createElement("option");
      element.setAttribute("value", value);
      element.innerText = value;
      select.appendChild(element);
    });

    return select;
  }

  createRangeEventListener(range) {
    range.select.addEventListener("change", (event) => {
      this.setRange(range, event.target.value);
      this.setValue();
    });

    for (const [value, item] of range.items) {
      item.container.addEventListener("click", () => {
        this.setRange(range, value);
        this.setValue();
      });
    }
  }

  setRange(range, value) {
    if (value || value === 0) {
      range.value = value;
    }

    for (const [key, item] of range.items) {
      if (key === range.value) {
        item.container.classList.add("range-item-container_selected");
      } else {
        item.container.classList.remove("range-item-container_selected");
      }
    }

    const options = range.select.options;

    for (let i = 0; i < options.length; i++) {
      if (options[i].value !== range.value) {
        options[i].removeAttribute("selected");
      } else {
        options[i].setAttribute("selected", "");
      }
    }
  }

  createRangeItem(range, value) {
    const item = document.createElement("div");
    const valueText = document.createElement("p");
    const circle = document.createElement("div");

    item.classList.add("range-item-container");

    valueText.innerText = value;

    item.appendChild(valueText);
    item.appendChild(circle);

    return {
      container: item,
      value: valueText,
      circle
    };
  }

  createOdometers() {
    const priceValueContainer = document.getElementById("price-odometer");
    this.odometer = new window.Odometer({
      el: priceValueContainer,
      value: this.value,
      numberLength: 5,
      theme: "minimal",
      format: "(ddddd)"
    });
    const countValueContainer = document.getElementById("count-odometer");
    this.countOdometer = new window.Odometer({
      el: countValueContainer,
      value: this.count,
      numberLength: 6,
      theme: "minimal",
      format: "(dddddd)"
    });
  }
}

export default Range;
