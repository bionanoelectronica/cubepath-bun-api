export interface AIProvider {
  name: string;
  chatStream(messages: any[]): AsyncGenerator<string, void, unknown>;
}
