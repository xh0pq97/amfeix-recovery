import React from 'react';
import { render } from '@testing-library/react';
import App from './index';

test('renders App node', () => {
  const renderedApp = render(<App/>);
  const nApp = renderedApp.findByAltText("App"); 
  expect(nApp).toBeInTheDocument();
});
