import qrcode

def generate_qr_code(link, output_file="qr_code.png"):
    """
    Generates a QR code for the provided link and saves it as an image file.

    Parameters:
        link (str): The URL or text to encode in the QR code.
        output_file (str): The filename for the output image. Defaults to 'qr_code.png'.
    
    Returns:
        str: The path to the saved QR code image.
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
    
    # Save the image to a file.
    img.save(output_file)
    print(f"QR code saved to {output_file}")
    return output_file

# Example usage:
if __name__ == "__main__":
    url = "https://www.example.com"
    generate_qr_code(url, "example_qr.png")
