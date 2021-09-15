import {Button, Form, Input} from "antd";
import {useMutation} from "react-query";
import {LoginOutlined, UserOutlined, LockOutlined} from '@ant-design/icons'

export default function LoginForm({history}){
    const [form] = Form.useForm()

    const styles = {
        inputStyle:{
            width: 280,
            float: 'right'
        },
        formItemStyle:{
            alignItems: 'center',
            justifyContent: 'space-between'
        }
    }

    const loginMutation = useMutation(loginObj => {
        //TODO: This is usually a request to a web service
        console.log(loginObj)
        history.push('/home')
    }, {
        onSuccess: async (data, variables, context) => {
            //TODO: Here is the part that your request succeeded
            // You have access to the request response through data parameter
        },
        onError: async (error, variables, context) => {
            //TODO: Here your request failed, handle it
            // You have access to the error through error parameter
        }
    })



    return (
        <Form form={form} onFinish={data => loginMutation.mutate(data)}>
            <Form.Item
                label="Username"
                name="username"
                rules={[{required: true, message: 'A username is required!'}]}
            >
                <Input style={styles.inputStyle} prefix={<UserOutlined/>}/>
            </Form.Item>
            <Form.Item
                label="Password"
                name="password"
                rules={[{required: true, message: 'A password is required!'}]}
            >
                <Input.Password style={styles.inputStyle} prefix={<LockOutlined/>}/>
            </Form.Item>
            <Form.Item>
                <Button style={styles.inputStyle} htmlType="submit" icon={<LoginOutlined/>} loading={loginMutation.isLoading} type="primary">Sign In</Button>
            </Form.Item>
        </Form>
    )
}