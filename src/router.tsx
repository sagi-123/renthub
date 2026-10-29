import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  const origGetMatchedRoutes = router.getMatchedRoutes.bind(router);
  router.getMatchedRoutes = ((pathname: string) => {
    const res: any = origGetMatchedRoutes(pathname);
    if (res && typeof res === "object" && !Array.isArray(res)) {
      const arr: any = [res.matchedRoutes, res.routeParams ?? res.rawParams, res.foundRoute];
      return Object.assign(arr, res);
    }
    return res;
  }) as any;

  return router;
};

