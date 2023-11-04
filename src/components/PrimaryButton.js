import Button from '@mui/material/Button';

function PrimaryButton({ onClick, buttonText }) {
    return (
        <Button onClick={onClick} variant='outlined' sx={{ backgroundColor: '#F7B93E', '&:hover': { backgroundColor: '#FFD684' }, color: 'black' }}>
            {buttonText}
        </Button>
    );
}

export default PrimaryButton;
