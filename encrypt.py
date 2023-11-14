import sys
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import base64



def encrypt():
    faceId=sys.argv[2]
    filename=sys.argv[1]
    file_path="./uploads/"+filename
    salt=b"TokeBolboNa"
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        iterations=100000,
        salt=salt,
        length=32  # Length of the derived key (adjust as needed)
    )
    key = kdf.derive(faceId.encode())
    cipher_suite = Fernet(base64.urlsafe_b64encode(key))
    with open(file_path, 'rb') as file:
        file_content = file.read()
    encrypted_content = cipher_suite.encrypt(file_content)
    with open(file_path, "wb") as file:
        file.write(encrypted_content)
    print(filename)




if __name__ == '__main__':
    encrypt()