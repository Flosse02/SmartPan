export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

export interface AlertRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Listener = (request: AlertRequest | null) => void;

// Same indirection ConfigContext/apiConfig.ts uses: AlertHost (a real
// component, mounted once near the app root) registers itself here, so a
// plain function like `alert()` can be called from anywhere — including
// non-component code like api.ts — without needing to be a hook.
let listener: Listener | null = null;

export function registerAlertListener(fn: Listener | null) {
  listener = fn;
}

export function alert(title: string, message?: string, buttons?: AlertButton[]) {
  if (!listener) {
    console.warn('alert() called before AlertHost mounted:', title, message);
    return;
  }
  listener({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
}
