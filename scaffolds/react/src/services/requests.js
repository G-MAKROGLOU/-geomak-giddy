

export default class Requests {

    /**
     * Private static method to get the request params
     *
     * @returns The request parameters
     * @constructor
     */
    static #GET_PARAMS = () => ({
        "method": "GET",
        "headers": {
            "Content-Type": "application/json"
        }
    })

    static #DELETE_PARAMS = () => ({
        "method": "DELETE"
    })


    /**
     * Example request for use with react-query
     * @returns {Promise<any>}
     */
    static get_todos = async () => await(await fetch('https://jsonplaceholder.typicode.com/todos?userId=1', {...this.#GET_PARAMS()})).json()


    static delete_todo = todoId => fetch(`https://jsonplaceholder.typicode.com/todos/${todoId}`, {...this.#DELETE_PARAMS()})
}