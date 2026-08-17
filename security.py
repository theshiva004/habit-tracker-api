from passlib.context import CryptoContext

pwd_context = CryptoContext(schemes = ["bcrypt"],depracated = "auto")

def hash_password(password:str)->str:
    return pwd_context.hash(password)