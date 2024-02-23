class LoadStatus {
  percent?: number;
  currentData?: { [x in string]: any };
  constructor() {
    this.percent = undefined;
    this.currentData = undefined;
  }
}

const loadStatus = new LoadStatus();
export { loadStatus };
