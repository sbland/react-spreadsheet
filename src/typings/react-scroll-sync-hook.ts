declare module "react-scroll-sync-hook" {
  export type wrapprops = {
    nodeRefs: React.RefObject<HTMLDivElement>[];
    options: {
      proportional?: boolean;
    };
  };
  export function useScrollSyncWrap(props: wrapprops): null;
}
