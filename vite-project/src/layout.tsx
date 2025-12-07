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
        <div className="min-h-screen">
            <NavigationMenu>
                <NavigationMenuList>
                    {renderRoutes(childRoutes)}
                </NavigationMenuList>
            </NavigationMenu>
            <main>
                <Outlet />
            </main>
        </div>
    )
}

export default Layout;