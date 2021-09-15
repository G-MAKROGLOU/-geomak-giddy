import{StoreProvider} from './context/store'
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'
import {QueryClient, QueryClientProvider} from 'react-query'
import {ReactQueryDevtools} from "react-query/devtools";
import Home from './views/home'
import Login from './views/login'
import NotFound from './views/notfound'
import Todo from "./views/todo";

export default function App() {

  const queryClient = new QueryClient()

  return (
      <QueryClientProvider client={queryClient}>
            <StoreProvider>
              <Router>
                <Switch>
                    <Route exact path='/' component={Login}/>
                    <Route exact path='/home' component={Home}/>
                    <Route exact path='/todo' component={Todo}/>
                  <Route component={NotFound}/>
                </Switch>
              </Router>
            </StoreProvider>
          <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
  );
}

