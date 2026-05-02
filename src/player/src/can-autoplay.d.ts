declare module "can-autoplay" {
  interface CanAutoplayResult {
    result: boolean;
    error: Error | null;
  }
  interface CanAutoplay {
    audio: (options?: { muted?: boolean; timeout?: number; inline?: boolean }) => Promise<CanAutoplayResult>;
    video: (options?: { muted?: boolean; timeout?: number; inline?: boolean }) => Promise<CanAutoplayResult>;
  }
  const canAutoplay: CanAutoplay;
  export default canAutoplay;
}
