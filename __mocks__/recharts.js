// __mocks__/recharts.js
const React = jest.requireActual('react');

// A factory to create simple mock components for Recharts.
// This ensures that components that wrap other elements (like ResponsiveContainer)
// will still render their children in the test environment.
const createMockComponent = (displayName) => {
  const MockComponent = (props) => {
    return React.createElement('div', { 'data-testid': `mock-${displayName}` }, props.children);
  };
  MockComponent.displayName = displayName;
  return MockComponent;
};

// Mock only the components that are actually used from Recharts in the application.
// This avoids polluting the mock with unrelated properties from React and
// fixes the module resolution issue that caused React to be null.
module.exports = {
  ResponsiveContainer: createMockComponent('ResponsiveContainer'),
  LineChart: createMockComponent('LineChart'),
  ComposedChart: createMockComponent('ComposedChart'),
  Line: createMockComponent('Line'),
  XAxis: createMockComponent('XAxis'),
  YAxis: createMockComponent('YAxis'),
  CartesianGrid: createMockComponent('CartesianGrid'),
  Tooltip: createMockComponent('Tooltip'),
  Legend: createMockComponent('Legend'),
};