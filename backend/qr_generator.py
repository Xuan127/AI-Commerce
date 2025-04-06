import qrcode
import base64
from io import BytesIO

def generate_qr_code(link, output_file=None):
    """
    Generates a QR code for the provided link and returns its base64 encoding.
    Optionally saves it as an image file if output_file is provided.

    Parameters:
        link (str): The URL or text to encode in the QR code.
        output_file (str, optional): If provided, the filename for the output image.
    
    Returns:
        str: Base64 encoded string representation of the QR code image.
    """
    # Create a QRCode instance with desired configuration.
    qr = qrcode.QRCode(
        version=1,  # Controls the size of the QR Code; 1 is 21x21.
        error_correction=qrcode.constants.ERROR_CORRECT_L,  # About 7% error correction.
        box_size=10,  # Size of each box in pixels.
        border=4,  # Thickness of the border (boxes).
    )
    
    # Add data (the link) to the QR code.
    qr.add_data(link)
    qr.make(fit=True)

    # Generate the image.
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save the image to a BytesIO object
    buffer = BytesIO()
    img.save(buffer)
    buffer.seek(0)
    
    # Generate base64 string
    base64_string = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    # Optionally save to file if output_file is provided
    if output_file:
        img.save(output_file)
        print(f"QR code saved to {output_file}")
        
    return base64_string

# Example usage:
if __name__ == "__main__":
    url = "https://www.example.com"
    # Get base64 string
    base64_qr = generate_qr_code(url)
    print(f"Base64 QR code: {base64_qr[:50]}...")  # Print first 50 chars
    
    # Optionally save to file as well
    generate_qr_code(url, "example_qr.png")
