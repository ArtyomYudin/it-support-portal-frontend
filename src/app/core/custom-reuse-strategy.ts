import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot, Route } from '@angular/router';

import { Injectable } from '@angular/core';

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {
  private routesToCache: string[] = ['cached_user_request', 'cached_pacs', 'cached_avaya', 'cached_dhcp', 'cached_vpn', 'cached_setting'];

  // private storedRouteHandles = new Map<string, DetachedRouteHandle>();
  private storedRouteHandles: Map<Route, DetachedRouteHandle> = new Map();

  // Decides if the route should be stored
  public shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // return this.routesToCache.indexOf(route.routeConfig.path) > -1;
    return route.data.reuseRoute || false;
    // return true;
  }

  // Store the information for the route we're destructing
  public store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    // this.storedRouteHandles.set(route.routeConfig.path, handle);
    if (!route.routeConfig) return;
    this.storedRouteHandles.set(route.routeConfig, handle);
  }

  // Return true if we have a stored route object for the next route
  public shouldAttach(route: ActivatedRouteSnapshot): boolean {
    // return this.storedRouteHandles.has(route.routeConfig.path);
    return !!route.routeConfig && !!this.storedRouteHandles.get(route.routeConfig);
  }

  // If we returned true in shouldAttach(), now return the actual route data for restoration
  public retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    // return this.storedRouteHandles.get(route.routeConfig.path);
    if (!route.routeConfig || !this.storedRouteHandles.has(route.routeConfig)) return null;
    return this.storedRouteHandles.get(route.routeConfig);
  }

  // Reuse the route if we're going to and from the same route
  public shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}
