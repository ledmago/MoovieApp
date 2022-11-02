const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const Schema = mongoose.Schema;
const userSchema = new Schema({
    user: { type: String, required: true, unique: true },
    genres: { type: Array, required: true },
}, { timestamps: true });


// subscription : 0 (Üyelik Yok) , 1 ("")
userSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('genres', userSchema);