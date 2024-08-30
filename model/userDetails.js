import mongoose from "mongoose";
const studentsSchema = new mongoose.Schema({
    name:String,
    email: String,
    password:String,
    course:String,
    dept_name:String,
    univ_col_name:String,


  });
export const students=mongoose.model('studentsDetails',studentsSchema);
