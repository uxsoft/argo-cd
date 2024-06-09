import { FormField, NotificationType } from 'argo-ui';
// import * as PropTypes from 'prop-types';
import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { Form, Text } from 'react-form';
import { RouteComponentProps } from 'react-router';

import { ArgoCDContext } from '../../shared/context';
import { AuthSettings } from '../../shared/models';
import { services } from '../../shared/services';
import { getPKCERedirectURI, pkceLogin } from './utils';

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

    const login = async (username: string, password: string, returnURL: string) => {
        console.log("Logging in", appContext);
        try {
            setLoginError('');
            setLoginInProgress(true);
            appContext.navigation.goto('.', { sso_error: null });
            await services.users.login(username, password);
            setLoginInProgress(false);
            if (returnURL) {
                const url = new URL(returnURL);
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

    return (
        <div className='login'>
            <div className='login__content show-for-medium'>
                <div className='login__text'>Let's get stuff deployed!</div>
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
                    <Form
                        onSubmit={(params: LoginForm) => login(params.username, params.password, returnUrl)}
                        onSubmitFailure={(params) => console.log(params)}
                        validateError={(params: LoginForm) => ({
                            username: !params.username && 'Username is required',
                            password: !params.password && 'Password is required',
                        })}
                    >
                        {(formApi) => (
                            <form role='form' className='width-control' onSubmit={formApi.submitForm}>
                                <div className='argo-form-row'>
                                    <FormField
                                        formApi={formApi}
                                        label='Username'
                                        field='username'
                                        component={Text}
                                        componentProps={{ autoCapitalize: 'none' }}
                                    />
                                </div>
                                <div className='argo-form-row'>
                                    <FormField
                                        formApi={formApi}
                                        label='Password'
                                        field='password'
                                        component={Text}
                                        componentProps={{ type: 'password' }}
                                    />
                                    {loginError && <div className='argo-form-row__error-msg'>{loginError}</div>}
                                </div>
                                <div className='login__form-row'>
                                    <button
                                        disabled={loginInProgress}
                                        className='argo-button argo-button--full-width argo-button--xlg'
                                        type='submit'
                                    >
                                        Sign In
                                    </button>
                                </div>
                            </form>
                        )}
                    </Form>
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
