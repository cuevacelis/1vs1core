import React, { type ReactNode } from "react";

/**
 * Props for the ErrorBoundary component.
 */
interface IProps {
	children: ReactNode;
	fallback: ReactNode;
}

/**
 * State for the ErrorBoundary component.
 */
interface State {
	hasError: boolean;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export default class ErrorBoundary extends React.Component<IProps, State> {
	constructor(props: IProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error("Uncaught error:", error, info.componentStack);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}

		return this.props.children;
	}
}
