import React from 'react';
import styled from '@emotion/styled';


const TruncateBase = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px; // Adjust based on your needs
`;

const Truncate = React.forwardRef((props, ref) => <TruncateBase ref={ref} {...props} />);

export default Truncate;
