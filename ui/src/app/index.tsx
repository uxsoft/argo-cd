import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as Moment from 'moment';
import { App } from './app';

import { ThemeProvider } from "@material-tailwind/react";

const root = createRoot(document.getElementById("app"));

root.render(
    //   <React.StrictMode>
    <ThemeProvider>
        <App />
    </ThemeProvider>
    //   </React.StrictMode>
);
(window as any).React = React;
// (window as any).ReactDOM = ReactDOM;
(window as any).Moment = Moment;
