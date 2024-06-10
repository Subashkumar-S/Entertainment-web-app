import { BrowserRouter as Router } from "react-router-dom";
import ProjectRoutes from "./Routes/index";
import { Provider } from "react-redux";
import store from "./store/store";

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <ProjectRoutes />
      </Router>
    </Provider>
  )
}