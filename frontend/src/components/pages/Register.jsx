import React from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { createAccount } from "../../store/authSlice";

function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const submit = async (data) => {
    const resultAction = await dispatch(createAccount(data));
    if (createAccount.fulfilled.match(resultAction)) {
      navigate("/login");
    }
  };0

  return (
    <div className="flex items-center justify-center w-full min-h-screen py-5 bg-green-50">
      <div className="mx-auto w-3xl max-w-lg bg-white rounded-xl p-6 border border-green-100 shadow-lg">
        <p className="mt-2 text-center text-base text-black">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Login
          </Link>
        </p>

        <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-6">

          <div>
            <Input
              label="Name"
              placeholder="Enter your name"
              type="text"
              {...register("name", { required: "Name is required" })}
              className="bg-blue-100 text-blue-900"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <Input
              label="Email"
              placeholder="Enter your email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[\w.-]+@[\w.-]+\.\w{2,4}$/,
                  message: "Invalid email format",
                },
              })}
              className="bg-blue-100 text-blue-900"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <Input
              label="Password"
              placeholder="Enter your password"
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Minimum 6 characters required" },
              })}
              className="bg-blue-100 text-blue-900"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <Button className="w-full bg-green-800 hover:bg-blue-700 text-white">
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Register;
