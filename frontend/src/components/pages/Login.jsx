
import React from 'react'
import {useForm} from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../common/Input'
import Button from '../common/Button'
import { loginUser } from '../../store/authSlice'
import socketService from '../../socketService'

function Login() {
  const {register, handleSubmit} = useForm()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const submit = async (data) => {
    try {
      await dispatch(loginUser(data)).unwrap();
      socketService.connect();
  
      navigate('/');
    } catch (error) {
      console.error("Login failed:", error);
      navigate('/login'); 
    }
  };
  
return (
<>
 <div className="w-full h-full bg-teal-500 flex items-center justify-center overflow-hidden"> 
<div className="w-full max-w-lg bg-white rounded-xl p-10 border border-teal-300 shadow-lg">
      <p className="mt-2 text-center text-base text-black">
        Don't have an account?&nbsp;
        <Link to="/register" className="font-medium text-blue-600 hover:underline">
          Sign Up
        </Link>
      </p>

      <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-6">
        <Input
          label="Email"
          placeholder="Enter your email"
          type="email"
          {...register('email', { required: true })}
          className="bg-blue-100 text-blue-900"
        />
        <Input
          label="Password"
          placeholder="Enter your password"
          type="password"
          {...register('password', { required: true })}
          className="bg-blue-100 text-blue-900"
        />
        <Button className="w-full bg-teal-800 hover:bg-blue-700 text-white">
          Sign in
        </Button>
      </form>
    </div>
</div>
</>
)};
export default Login 
