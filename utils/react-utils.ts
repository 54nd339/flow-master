import React from 'react';

/**
 * Renders a React component from a component type (useful for dynamic icon rendering)
 * @param Component - React component type
 * @param props - Props to pass to the component
 * @returns Rendered React element
 */
export const renderIcon = (
  Component: React.ComponentType<{ size?: number; className?: string }>,
  props: { size?: number; className?: string } = {}
): React.ReactElement => {
  return React.createElement(Component, props);
};

