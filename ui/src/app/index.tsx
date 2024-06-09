import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Moment from 'moment';
import {App} from './app';

ReactDOM.render(<App />, document.getElementById('app'));

(window as any).React = React;
(window as any).ReactDOM = ReactDOM;
(window as any).Moment = Moment;
