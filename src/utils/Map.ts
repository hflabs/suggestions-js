export default class Map<K = string, V = unknown> {
  private items: [K, V][] = [];

  private getItem(key: K) {
    return this.items.find((item) => item[0] === key);
  }

  public get(key: K): V | undefined {
    return this.getItem(key)?.[1];
  }

  public set(key: K, value: V): void {
    const item = this.getItem(key);
    if (item) {
      item[1] = value;
    } else {
      this.items.push([key, value]);
    }
  }

  public delete(key: K): void {
    const item = this.getItem(key);
    if (item) {
      const index = this.items.indexOf(item);
      this.items.splice(index, 1);
    }
  }
}
