import { NotificationType } from 'argo-ui';
import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { useForm } from "react-hook-form"
import { RouteComponentProps } from 'react-router';

import { ArgoCDContext } from '../../shared/context';
import { AuthSettings } from '../../shared/models';
import { services } from '../../shared/services';
import { getPKCERedirectURI, pkceLogin } from './utils';
import { Button, Input } from "@material-tailwind/react";

import './login.scss';

export interface LoginForm {
    username: string;
    password: string;
}

const Login: React.FC<RouteComponentProps<{}>> = (props) => {
    const [authSettings, setAuthSettings] = useState<AuthSettings | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginInProgress, setLoginInProgress] = useState<boolean>(false);
    const [returnUrl, setReturnUrl] = useState<string>('');
    const [hasSsoLoginError, setHasSsoLoginError] = useState<boolean>(false);

    const appContext = useContext(ArgoCDContext);

    useEffect(() => {
        const fetchAuthSettings = async () => {
            const settings = await services.authService.settings();
            setAuthSettings(settings);
        };

        const search = new URLSearchParams(props.history.location.search);
        const returnUrl = search.get('return_url') || '';
        const hasSsoLoginError = search.get('has_sso_error') === 'true';

        setReturnUrl(returnUrl);
        setHasSsoLoginError(hasSsoLoginError);

        fetchAuthSettings();
    }, [props.history.location.search]);

    const login = async (form: { username: string, password: string, returnURL: string }) => {
        console.log("Logging in ", form)
        try {
            setLoginError('');
            setLoginInProgress(true);
            appContext.navigation.goto('.', { sso_error: null });
            await services.users.login(form.username, form.password);
            setLoginInProgress(false);
            if (form.returnURL) {
                const url = new URL(form.returnURL);
                appContext.navigation.goto(url.pathname + url.search);
            } else {
                appContext.navigation.goto('/applications');
            }
        } catch (e) {
            setLoginError(e.response.body.error);
            setLoginInProgress(false);
        }
    };

    const ssoConfigured =
        authSettings &&
        ((authSettings.dexConfig && (authSettings.dexConfig.connectors || []).length > 0) || authSettings.oidcConfig);

    const loginForm = useForm();

    return (
        <div className='login'>
            <div className='login__content show-for-medium'>
                <div className='login__text'>Let's get stuff deployed!</div>

                <div className='argo__logo' />
            </div>
            <div className='login__box'>
                <div className='login__logo width-control'>
                    <img className='logo-image' src='assets/images/argo_o.svg' alt='argo' />
                </div>
                {ssoConfigured && (
                    <div className='login__box_saml width-control'>
                        <a
                            {...(authSettings?.oidcConfig?.enablePKCEAuthentication
                                ? {
                                    onClick: async () => {
                                        pkceLogin(authSettings.oidcConfig, getPKCERedirectURI().toString()).catch((err) => {
                                            appContext.notifications.show({
                                                type: NotificationType.Error,
                                                content: err?.message || JSON.stringify(err),
                                            });
                                        });
                                    },
                                }
                                : { href: `auth/login?return_url=${encodeURIComponent(returnUrl)}` })}
                        >
                            <button className='argo-button argo-button--base argo-button--full-width argo-button--xlg'>
                                {(authSettings.oidcConfig && <span>Log in via {authSettings.oidcConfig.name}</span>) ||
                                    (authSettings.dexConfig.connectors.length === 1 && (
                                        <span>Log in via {authSettings.dexConfig.connectors[0].name}</span>
                                    )) || <span>SSO Login</span>}
                            </button>
                        </a>
                        {hasSsoLoginError && <div className='argo-form-row__error-msg'>Login failed.</div>}
                        {authSettings && !authSettings.userLoginsDisabled && (
                            <div className='login__saml-separator'>
                                <span>or</span>
                            </div>
                        )}
                    </div>
                )}
                {authSettings && !authSettings.userLoginsDisabled && (

                    <form role='form' className='flex flex-col gap-6 mt-6' onSubmit={loginForm.handleSubmit(login)}>
                        <Input {...loginForm.register("username")} autoCapitalize='none' label='Username' />
                        <Input {...loginForm.register("password")} type="password" label='Password' />
                        <input {...loginForm.register("returnURL")} type='hidden' value={returnUrl} />
                        {loginError && <div className='argo-form-row__error-msg'>{loginError}</div>}
                        <Button
                            disabled={loginInProgress}
                            fullWidth
                            type='submit'
                            color='blue-gray'
                        >
                            Sign In
                        </Button>
                    </form>
                )}
                {authSettings && authSettings.userLoginsDisabled && !ssoConfigured && (
                    <div className='argo-form-row__error-msg'>Login is disabled. Please contact your system administrator.</div>
                )}
                <div className='login__footer'>
                    <a href='https://argoproj.io' target='_blank'>
                        <img className='logo-image' src='assets/images/argologo.svg' alt='argo' />
                    </a>
                </div>
            </div>
        </div>
    );
};

// Login.contextTypes = {
//     apis: PropTypes.object,
// };

export default Login;
