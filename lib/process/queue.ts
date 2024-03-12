type Task<T> = () => Promise<T>;

export class Queue {
  private queue: Array<() => void> = [];
  private running = 0;
  private limit: number;

  constructor(limit: number = 3) {
    this.limit = limit;
  }

  async add<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.running--;
          this.next();
        }
      });
      this.next();
    });
  }

  private next() {
    if (this.running >= this.limit || this.queue.length === 0) return;
    const task = this.queue.shift();
    if (task) task();
  }

  async all<T>(tasks: Task<T>[]): Promise<T[]> {
    return Promise.all(tasks.map(task => this.add(task)));
  }
}

export const create = (limit?: number) => new Queue(limit);
