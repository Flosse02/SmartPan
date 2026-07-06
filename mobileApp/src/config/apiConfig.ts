let currentBaseUrl = 'http://192.168.1.100:3000';

export function setApiBaseUrl(url: string) {
  currentBaseUrl = url;
}

export function getApiBaseUrl(): string {
  return currentBaseUrl;
}