export type FxInit = (root: HTMLElement) => () => void;

export interface FxComponentProps {
  fallbackSrc?: string;
  staticMode?: boolean;
  className?: string;
}

export interface LocationPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
}
