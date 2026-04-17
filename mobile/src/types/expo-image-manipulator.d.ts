declare module 'expo-image-manipulator' {
  export type ManipulateAction = { resize?: { width?: number; height?: number } } | { rotate?: number } | { flip?: 'horizontal' | 'vertical' } | { crop?: { originX: number; originY: number; width: number; height: number } };

  export type ManipulateOptions = {
    compress?: number; // 0..1
    format?: any;
    base64?: boolean;
  };

  export type ManipulateResult = {
    uri: string;
    width: number;
    height: number;
    base64?: string;
  };

  export const SaveFormat: {
    JPEG: any;
    PNG: any;
    WEBP: any;
  };

  export function manipulateAsync(uri: string, actions: ManipulateAction[], options?: ManipulateOptions): Promise<ManipulateResult>;

  const ImageManipulator: {
    manipulateAsync: typeof manipulateAsync;
    SaveFormat: typeof SaveFormat;
  };

  export default ImageManipulator;
}
