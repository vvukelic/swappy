import { useRef } from 'react';
import styled from '@emotion/styled';


const RelativePositionContainer = styled.div`
    position: relative;
    display: grid;
`;

function DropdownElement({ setShowHoverMenu, children }) {
    const leaveTimeoutRef = useRef(null);

    const handleMouseEnter = () => {
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
        }
        setShowHoverMenu(true);
    };

    const handleMouseLeave = () => {
        leaveTimeoutRef.current = setTimeout(() => {
            setShowHoverMenu(false);
        }, 500);
    };

    return (
        <RelativePositionContainer onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {children}
        </RelativePositionContainer>
    );
}

export default DropdownElement;
