import { BrowserRouter as Router } from "react-router-dom";
import ProjectRoutes from "./Routes/index";
import { Provider } from "react-redux";
import store from "./store/store";
import AuthBootstrap from "./components/AuthBootstrap";

export default function App() {
  return (
    <Provider store={store}>
      <AuthBootstrap>
        <Router>
          <ProjectRoutes />
        </Router>
      </AuthBootstrap>
    </Provider>
  )
}