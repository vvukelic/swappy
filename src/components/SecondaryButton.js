import Button from '@mui/material/Button';

function SecondaryButton({ onClick, buttonText }) {
    return (
        <Button onClick={onClick} variant='outlined' sx={{ backgroundColor: '#633d73', '&:hover': { backgroundColor: '#7f4e94' }, color: 'white' }}>
            {buttonText}
        </Button>
    );
}

export default SecondaryButton;
