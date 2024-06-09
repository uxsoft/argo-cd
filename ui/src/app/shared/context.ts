import { AppContext as ArgoAppContext, NavigationApi, NotificationsApi, PopupApi } from 'argo-ui';
import * as React from 'react';
import * as models from './models';

export type AppContext = ArgoAppContext & { 
    apis: { popup: PopupApi; notifications: NotificationsApi; navigation: NavigationApi; baseHref: string } 
};

export const ArgoCDContext = React.createContext({} as ContextApis); 

export interface ContextApis {
    history: History, 
    popup: PopupApi;
    notifications: NotificationsApi;
    navigation: NavigationApi;
    baseHref: string;
}
export const Context = React.createContext<ContextApis & { history: History }>(null);
export const { Provider, Consumer } = Context;

export const AuthSettingsCtx = React.createContext<models.AuthSettings>(null);
