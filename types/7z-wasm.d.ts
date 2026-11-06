declare module '7z-wasm' {
  export type SevenZipFS = {
    mkdir(path: string): void;
    chdir(path: string): void;
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
    readdir(path: string): string[];
    stat(path: string): { mode: number };
    isDir(mode: number): boolean;
  };

  export type SevenZipInstance = {
    FS: SevenZipFS;
    callMain(args: string[]): void;
  };

  export type SevenZipOptions = {
    noInitialRun?: boolean;
    print?: (text: string) => void;
    printErr?: (text: string) => void;
  };

  export type SevenZipFactory = (options?: SevenZipOptions) => Promise<SevenZipInstance>;

  export default function SevenZip(options?: SevenZipOptions): Promise<SevenZipInstance>;
}
