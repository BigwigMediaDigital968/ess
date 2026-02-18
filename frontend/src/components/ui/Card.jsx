import { motion } from "framer-motion";
import clsx from "clsx";

export const Card = ({ children, className }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
                "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl",
                className
            )}
        >
            {children}
        </motion.div>
    );
};
