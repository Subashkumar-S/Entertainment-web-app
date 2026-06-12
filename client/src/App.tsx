import { BrowserRouter as Router } from "react-router-dom";
import ProjectRoutes from "./Routes/index";
import { Provider } from "react-redux";
import store from "./store/store";
import AuthBootstrap from "./components/AuthBootstrap";
import { TrailerProvider } from "./components/TrailerModal";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <AuthBootstrap>
          <TrailerProvider>
            <Router>
              <ProjectRoutes />
            </Router>
          </TrailerProvider>
        </AuthBootstrap>
      </ErrorBoundary>
    </Provider>
  )
}