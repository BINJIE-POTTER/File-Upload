import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { routes } from "./router";

const Layout = () => {
    const location = useLocation();
    
    // Get the layout route (first route with children)
    const layoutRoute = routes.find(route => route.path === "/" && route.children);
    const childRoutes = layoutRoute?.children || [];

    const renderRoutes = (routes: RouteObject[]) => {
        return routes
            .filter((route) => route.path && !route.index) // Filter out index routes
            .map((route: RouteObject) => {
                const path = route.path!;
                
                return (
                    <NavigationMenuItem key={path}>
                        <NavigationMenuLink 
                            asChild
                            data-active={location.pathname === `/${path}` ? "true" : undefined}
                        >
                            <NavLink to={`/${path}`}>
                                {path.charAt(0).toUpperCase() + path.slice(1)}
                            </NavLink>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                );
            });
    };

    return (
        // h-screen + flex-col: pins the root to the viewport so children can
        // use h-full to get the remaining height below the nav bar.
        <div className="flex flex-col h-screen">
            {/* shrink-0: prevents NavigationMenu's internal flex-1 from expanding
                the nav to fill the entire column height */}
            <div className="shrink-0 border-b border-gray-100">
                <NavigationMenu>
                    <NavigationMenuList>
                        {renderRoutes(childRoutes)}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            {/* flex-1 min-h-0: fills remaining space after the nav */}
            <main className="flex-1 min-h-0 overflow-hidden">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout;